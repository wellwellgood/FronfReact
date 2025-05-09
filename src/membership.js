// membership.js - Firebase + reCAPTCHA 통합 단일버전
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";
import styles from "./membership.module.css";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let app, auth, recaptchaVerifier;

const initializeFirebase = () => {
  if (!app) app = initializeApp(firebaseConfig);
  if (!auth) auth = getAuth(app);
  return auth;
};

const generateRecaptcha = (authInstance) => {
  if (!authInstance) {
    console.error("❌ authInstance가 undefined입니다.");
    return null;
  }

  if (recaptchaVerifier) {
    console.log("ℹ️ 기존 reCAPTCHA 재사용");
    return recaptchaVerifier;
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => console.log("✅ reCAPTCHA verified"),
        "expired-callback": () => console.warn("⚠️ reCAPTCHA expired")
      },
      authInstance
    );
    console.log("✅ reCAPTCHA 초기화 완료");
    return recaptchaVerifier;
  } catch (err) {
    console.error("❌ reCAPTCHA 생성 오류:", err);
    return null;
  }
};

const Membership = () => {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
    phone1: "",
    phone2: "",
    phone3: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authInstance = initializeFirebase();
    if (!authInstance) return;
    generateRecaptcha(authInstance);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatPhoneNumber = () => {
    const { phone1, phone2, phone3 } = formData;
    return phone1.startsWith("0")
      ? `+82${phone1.slice(1)}${phone2}${phone3}`
      : `+82${phone1}${phone2}${phone3}`;
  };

  const handleSendCode = async () => {
    const authInstance = initializeFirebase();
    const verifier = generateRecaptcha(authInstance);
    if (!authInstance || !verifier) {
      alert("인증 시스템 오류. 관리자에게 문의하세요.");
      return;
    }

    setIsLoading(true);

    try {
      const phoneNumber = formatPhoneNumber();
      const confirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, verifier);
      setConfirmation(confirmationResult);
      alert("✅ 인증번호가 전송되었습니다.");
    } catch (error) {
      console.error("❌ 인증번호 전송 실패:", error);
      alert(`❌ 인증번호 전송 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmation || !verificationCode.trim()) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmation.confirm(verificationCode);
      setFirebaseUser(result.user);
      setVerifySuccess(true);
      alert("✅ 휴대폰 인증 성공");
    } catch (error) {
      console.error("❌ 인증 실패:", error);
      alert(`❌ 인증 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verifySuccess || !firebaseUser) {
      alert("❌ 휴대폰 인증을 먼저 완료해주세요.");
      return;
    }

    const fullPhone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;
    setIsLoading(true);

    try {
      const res = await axios.post("https://react-server-wmqa.onrender.com/api/auth/register", {
        username: formData.username,
        name: formData.name,
        password: formData.password,
        phone: fullPhone,
        firebase_uid: firebaseUser.uid,
      });

      if (res.data?.message === "회원가입 성공") {
        alert("🎉 회원가입이 완료되었습니다!");
        window.location.href = "/";
      } else {
        alert(`❌ 회원가입 실패: ${res.data?.message}`);
      }
    } catch (error) {
      console.error("❌ 회원가입 오류:", error);
      alert(`❌ 서버 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }

  return (
    <div className={styles.findID}>
      <div className={styles.img}></div>
      <form className={styles.IDform} onSubmit={handleSubmit}>
        <div className={styles.IDarea}>
          <h1>회원가입</h1>
          {errorMessage && <p className={styles.errorMessage} style={{ color: "red" }}>{errorMessage}</p>}
          <input 
            type="text" 
            name="username" 
            value={formData.username} 
            onChange={handleChange} 
            placeholder="아이디" 
            className={styles.name} 
            required 
            disabled={isLoading}
          />
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="이름" 
            className={styles.name} 
            required 
            disabled={isLoading}
          />
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            placeholder="비밀번호 (6자 이상)" 
            className={styles.name} 
            required 
            disabled={isLoading}
            minLength={6}
          />
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            placeholder="비밀번호 확인" 
            className={styles.name} 
            required 
            disabled={isLoading}
          />

          <div className={styles.phoneGroup}>
            <input 
              type="text" 
              name="phone1" 
              value={formData.phone1} 
              onChange={handleChange} 
              maxLength="3" 
              placeholder="010" 
              required 
              disabled={isLoading || verifySuccess}
            />
            <span>-</span>
            <input 
              type="text" 
              name="phone2" 
              value={formData.phone2} 
              onChange={handleChange} 
              maxLength="4" 
              placeholder="1234" 
              required 
              disabled={isLoading || verifySuccess}
            />
            <span>-</span>
            <input 
              type="text" 
              name="phone3" 
              value={formData.phone3} 
              onChange={handleChange} 
              maxLength="4" 
              placeholder="5678" 
              required 
              disabled={isLoading || verifySuccess}
            />
          </div>

          <button
            type="button"
            className={styles.verifysend}
            onClick={handleSendCode}
            disabled={
              isLoading || 
              initializationStatus !== "success" || 
              !formData.phone1 || 
              !formData.phone2 || 
              !formData.phone3 ||
              verifySuccess
            }
          >
            {isLoading ? "처리중..." : "인증번호 전송"}
          </button>

          <input 
            type="text" 
            value={verificationCode} 
            onChange={(e) => setVerificationCode(e.target.value)} 
            placeholder="인증번호 입력" 
            className={styles.verifyInput} 
            disabled={isLoading || !confirmation || verifySuccess}
          />
          
          <button 
            type="button" 
            className={styles.verifycheck} 
            onClick={handleVerifyCode}
            disabled={
              isLoading || 
              !confirmation || 
              verifySuccess || 
              !verificationCode.trim()
            }
          >
            {isLoading ? "인증중..." : "인증번호 확인"}
          </button>
          
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={
              isLoading || 
              !verifySuccess || 
              !formData.username || 
              !formData.name || 
              !formData.password || 
              formData.password !== formData.confirmPassword
            }
          >
            {isLoading ? "처리중..." : "가입하기"}
          </button>
          
          {verifySuccess && (
            <p className={styles.successMessage} style={{ color: "green", marginTop: "10px" }}>
              ✅ 휴대폰 인증이 완료되었습니다.
            </p>
          )}
        </div>
      </form>

      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Membership;
