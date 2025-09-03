import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Set admin role for a user
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an existing admin
  if (!(context.auth && context.auth.token.role === 'admin')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can add other admins'
    );
  }

  try {
    // Get user and add custom claim
    await admin.auth().setCustomUserClaims(data.userId, {
      role: 'admin'
    });

    // Update user's role in Firestore
    await admin.firestore().collection('users').doc(data.userId).update({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: `Successfully set admin role for user ${data.userId}`
    };
  } catch (error) {
    console.error('Error setting admin role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error setting admin role'
    );
  }
});
