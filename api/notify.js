import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, body } = req.body;

    // Initialize Firebase Admin securely
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
                databaseURL: process.env.FIREBASE_DATABASE_URL
            });
        } catch (err) {
            console.error("Admin Init Error:", err);
            return res.status(500).json({ error: 'Firebase Admin initialization failed.' });
        }
    }

    try {
        const db = admin.database();
        const usersRef = db.ref('users');
        const snapshot = await usersRef.once('value');
        
        if (!snapshot.exists()) {
            return res.status(200).json({ message: 'No users found in database.' });
        }

        const tokens =[];
        snapshot.forEach((child) => {
            const userData = child.val();
            if (userData.fcmToken) {
                tokens.push(userData.fcmToken);
            }
        });

        if (tokens.length === 0) {
            return res.status(200).json({ message: 'No FCM tokens found to notify.' });
        }

        // Multicast message payload
        const payload = {
            notification: { title, body },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(payload);
        res.status(200).json({ 
            success: true, 
            successCount: response.successCount, 
            failureCount: response.failureCount 
        });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ error: 'Failed to broadcast notification.' });
    }
}
