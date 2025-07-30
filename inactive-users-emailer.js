// inactive-users-emailer.js
const admin = require('firebase-admin');

async function main() {
  try {
    // Initialize Firebase Admin
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'sportiner-1'
      });
    }

    const db = admin.firestore();
    
    // Get all users from Firestore
    console.log('Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    const allUsers = [];
    
    usersSnapshot.forEach(doc => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${allUsers.length} total users`);
    
    // Filter users inactive for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const inactiveUsers = allUsers.filter(user => {
      if (!user.lastActive) return true; // No lastActive = inactive
      const lastActiveDate = new Date(user.lastActive);
      return lastActiveDate < sevenDaysAgo;
    });
    
    console.log(`Found ${inactiveUsers.length} inactive users`);
    
    if (inactiveUsers.length === 0) {
      console.log('No inactive users to email');
      await sendNotificationEmail(0);
      return;
    }
    
    // Send emails to inactive users
    let emailsSent = 0;
    for (const user of inactiveUsers) {
      try {
        await sendComebackEmail(user);
        emailsSent++;
        console.log(`Sent email to ${user.email}`);
        
        // Wait 3 seconds between emails (like your n8n workflow)
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }
    
    // Send notification email to you
    await sendNotificationEmail(emailsSent);
    
    console.log(`Process completed. Sent ${emailsSent} emails.`);
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

async function sendComebackEmail(user) {
  const emailData = {
    from: "comeBack@sportiner.com",
    to: [user.email],
    subject: `Even Zuckerberg Takes a Break from the Feed, ${user.name} – Play Time!`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Your Game > The Metaverse!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      color: #333;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: auto;
      padding: 24px;
    }
    .header {
      text-align: center;
      color: #005124;
    }
    .button {
      display: inline-block;
      background-color: #19E675;
      color: #005124 !important;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 16px;
      margin-top: 24px;
    }
    .footer {
      font-size: 12px;
      color: #888;
      text-align: center;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 class="header">Hey ${user.name}!</h2>
    <p style="text-align: center; font-size: 20px; font-weight: bold; margin-top: 30px;">
        "Less screen, more green! Your best life happens offline."
    </p>
    <p style="text-align: center; font-size: 16px; margin-top: 10px;">
        Even the tech giants know the power of a real-world game.
    </p>
    <p>We know the digital world can be captivating. You might be scrolling through feeds, seeing what everyone else is up to. But imagine actively creating your own highlight reel, right here in ${user.city}!</p>
    <p>Even Mark Zuckerberg swaps the metaverse for real-life action – he's into surfing, jiu-jitsu, and more! Your next ${user.sports?.[0] || 'sports'} match is calling, promising real sweat, real fun, and real connections. Don't just observe; participate! Send an invitation and make your own legendary moments.</p>
    <div style="text-align: center;">
      <a href="https://sportiner.com" class="button">Create Your Game Now!</a>
    </div>
    <p>Ready to unplug and play?</p>
    <p>Catch you on the court (or field!),</p>
    <p>The Sportiner Team 🎾</p>
    <div class="footer">
      This message was sent from a cloud, not a desk. Please don't hit reply!
      <br>© 2025 Sportiner. All rights reserved.
    </div>
  </div>
</body>
</html>`
  };
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });
  
  if (!response.ok) {
    throw new Error(`Email API error: ${response.status}`);
  }
  
  return response.json();
}

async function sendNotificationEmail(emailCount) {
  const notificationData = {
    from: "done@sportiner.com",
    to: ["artinmehri7777@gmail.com"],
    subject: "Artin, emails were sent on GitHub Actions for inactive users.",
    text: `Emails sent! Total: ${emailCount} inactive users contacted.`
  };
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notificationData)
  });
  
  if (!response.ok) {
    console.error('Failed to send notification email');
  }
}

// Run the main function
main();
