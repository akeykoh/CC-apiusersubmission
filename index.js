const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const serviceAccount = require('./trashcare-387803-firebase-adminsdk-hi4at-f6df30114e');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(express.json());

app.get('/usersubmission', async (req, res) => {
  try {
    const statusFilter = req.header('status');
    const trashRef = admin.firestore().collection('trashdispose');
    const usersRef = admin.firestore().collection('users');

    const usersSnapshot = await usersRef.get();

    const submissionData = [];

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();

      // Mencari dokumen di collection trashdispose yang memiliki nilai userId yang sama dengan nilai user.userId
      let trashQuery = trashRef.where('userId', '==', user.userId);

      // Filter berdasarkan status jika diberikan dalam header
      if (statusFilter && statusFilter !== 'All') {
        trashQuery = trashQuery.where('status', '==', statusFilter);
      }

      const trashSnapshot = await trashQuery.get();

      trashSnapshot.forEach((trashDoc) => {
        const trash = trashDoc.data();

        // Cek di trash ada trashId ada atau tidak
        const trashId = trash.hasOwnProperty('trashId') ? trash.trashId : '';

        // Data yang ditampilkan
        submissionData.push({
          "Trash ID": trashId,
          "User ID": user.userId,
          "Nama": user.name,
          "Nama bank": user.bankName,
          "Nama rekening": user.accountName,
          "Nomor rekening": user.accountNumber,
          "Deskripsi": trash.description,
          "Jumlah": trash.amount,
          "Lokasi": trash.location,
          "Status": trash.status
        });
      });
    }

    // Mengurutkan dari trashId terbaru
    submissionData.sort((a, b) => {
      const trashIdA = a["Trash ID"] || '';
      const trashIdB = b["Trash ID"] || '';
      return trashIdB.localeCompare(trashIdA);
    });

    if (submissionData.length === 0) {
      return res.json({ message: "Belum ada submission sampah yang dilakukan oleh user" });
    }

    res.json(submissionData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terdapat masalah dalam menampilkan submission sampah user' });
  }
});

exports.apiusersubmission = functions.https.onRequest(app);

// Tes di local
app.listen(3000, () => {
  console.log('Server berjalan pada port 3000');
});