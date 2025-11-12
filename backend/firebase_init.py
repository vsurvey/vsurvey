import os
import firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    # Service account key path
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

    # Initialize Firebase only once
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized successfully!")
    else:
        print("⚠️ Firebase already initialized, reusing existing app.")

    # Return Firestore client
    return firestore.client()
