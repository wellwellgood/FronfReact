// ✅ Firebase + EmailJS로 네이버 메일 방식 구현 예시 (React 기준)
// 파일 업로드 -> Firebase Storage -> 다운로드 URL -> EmailJS로 전송

import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import styles from "./AA/email.js/SendEmail.module.css"

// 🔧 Firebase 설정
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 🔧 초기화
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const FirebaseEmailForm = () => {
  const form = useRef();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setUploading(true);

    try {
      // 🔼 1. Firebase Storage에 업로드
      const storageRef = ref(storage, `uploads/${file.name}`);
      await uploadBytes(storageRef, file);

      // 🔗 2. 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);

      // 📨 3. EmailJS로 다운로드 링크 포함 전송
      const formData = new FormData(form.current);
      formData.append("download_link", downloadURL);

      await emailjs.sendForm(
        "service_a9udeim",
        "template_3nu35ld",
        form.current,
        "s9Hb7DTTLBcp34TPu"
      );

      alert("이메일 전송 성공!");
      form.current.reset();
      setFile(null);
    } catch (error) {
      console.error("업로드 또는 이메일 전송 오류:", error);
      alert("실패: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form ref={form} onSubmit={handleSubmit} className={styles.mailform}>
      
      <div className={styles.inputGroup}>
        <input
          type="email"
          name="user_email"
          placeholder="받는 사람 이메일"
          required
          className={styles.input}
        />
      </div>
  
      <div className={styles.inputGroup}>
        <input
          type="text"
          name="subject"
          placeholder="제목"
          required
          className={styles.input}
        />
      </div>
  
      <div className={styles.textAreaBox}>
        <textarea
          name="message"
          placeholder="메시지"
          required
        />
      </div>
  
      <div className={styles.inputGroup}>
        <input
          type="file"
          onChange={handleFileChange}
          required
          className={styles.fileButton}
        />
      </div>
  
      <input type="hidden" name="download_link" />
  
      <div className={styles.button}>
        <button
          type="submit"
          disabled={uploading}
          className={styles.submitButton}
        >
          {uploading ? "업로드 중..." : "보내기"}
        </button>
      </div>
    </form>
  );
};
export default FirebaseEmailForm;
