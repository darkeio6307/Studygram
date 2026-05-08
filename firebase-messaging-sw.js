importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Fetch secure config and initialize Firebase in SW
fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    
    messaging.onBackgroundMessage((payload) => {
      console.log('Background Message received: ', payload);
      const notificationTitle = payload.notification?.title || 'StudyGram Pro';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notice.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3074/3074058.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3074/3074058.png'
      };
      
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => console.error('FCM SW Init Error:', err));
