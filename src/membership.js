import React, { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirebaseAuth, initializeFirebase } from "./firebase";
import axios from "axios";
import styles from "./membership.module.css";

const Membership = () => {
  // useRef로 reCAPTCHA 컨테이너 참조 생성
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  
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
  const [errorMessage, setErrorMessage] = useState("");
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Firebase 초기화 함수
  const initFirebase = async () => {
    try {
      // Firebase 초기화
      const { auth } = initializeFirebase();
      
      if (!auth) {
        console.error("❌ Firebase 인증이 초기화되지 않았습니다.");
        setErrorMessage("Firebase 인증 초기화에 실패했습니다.");
        return false;
      }
      
      console.log("✅ Firebase 인증 초기화 성공");
      return true;
    } catch (error) {
      console.error("❌ Firebase 초기화 오류:", error);
      setErrorMessage("인증 시스템 초기화에 실패했습니다.");
      return false;
    }
  };

  // 컴포넌트 마운트 시 Firebase 초기화
  useEffect(() => {
    const initialize = async () => {
      const success = await initFirebase();
      setFirebaseInitialized(success);
    };
    
    initialize();
    
    // 컴포넌트 언마운트 시 reCAPTCHA 정리
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          console.warn("⚠️ reCAPTCHA 정리 중 오류:", e);
        }
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 전화번호 포맷 - 국제 형식으로 변환
  const formatPhoneNumber = () => {
    const { phone1, phone2, phone3 } = formData;
    // 010인 경우 첫 0을 제거하고 한국 국가 코드 +82 추가
    return `+82${phone1.replace(/^0+/, '')}${phone2}${phone3}`;
  };

  // reCAPTCHA 초기화 함수 (별도로 분리)
  const setupRecaptcha = async () => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("Firebase 인증이 초기화되지 않았습니다.");
      }
      
      // 기존 reCAPTCHA가 있으면 정리
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.warn("⚠️ 기존 reCAPTCHA 정리 중 오류:", e);
        }
        recaptchaVerifierRef.current = null;
      }
      
      // 새로운 div 요소 생성 및 추가 (DOM 직접 조작)
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (recaptchaContainer) {
        // 기존 내용 비우기
        recaptchaContainer.innerHTML = "";
        
        // 새 div 생성 및 추가
        const newDiv = document.createElement("div");
        newDiv.id = "recaptcha-verifier-container";
        recaptchaContainer.appendChild(newDiv);
        
        // 새 RecaptchaVerifier 생성
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          "recaptcha-verifier-container",
          {
            size: "invisible",
            callback: () => console.log("✅ reCAPTCHA verified"),
            "expired-callback": () => console.warn("⚠️ reCAPTCHA expired"),
          },
          auth
        );
        
        // reCAPTCHA 렌더링 완료를 기다림
        await recaptchaVerifierRef.current.render();
        console.log("✅ reCAPTCHA 렌더링 완료");
        return true;
      } else {
        throw new Error("reCAPTCHA 컨테이너를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("❌ reCAPTCHA 초기화 오류:", error);
      setErrorMessage(`reCAPTCHA 초기화 실패: ${error.message}`);
      return false;
    }
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Firebase가 초기화되었는지 확인
      if (!firebaseInitialized) {
        const success = await initFirebase();
        if (!success) {
          throw new Error("Firebase 초기화에 실패했습니다.");
        }
      }
      
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("인증 시스템이 준비되지 않았습니다.");
      }
      
      // 전화번호 검증
      const { phone1, phone2, phone3 } = formData;
      if (!phone1 || !phone2 || !phone3) {
        throw new Error("전화번호를 모두 입력해주세요.");
      }
      
      if (phone1.length < 2 || phone2.length < 3 || phone3.length < 4) {
        throw new Error("올바른 전화번호 형식이 아닙니다.");
      }
      
      // reCAPTCHA 설정
      const recaptchaSuccess = await setupRecaptcha();
      if (!recaptchaSuccess) {
        throw new Error("보안 인증(reCAPTCHA) 초기화에 실패했습니다.");
      }
      
      const phoneNumber = formatPhoneNumber();
      console.log("📱 인증번호 전송 시도:", phoneNumber);
      
      // signInWithPhoneNumber 호출
      if (!recaptchaVerifierRef.current) {
        console.error("❌ recaptchaVerifierRef.current가 null입니다.");
        throw new Error("reCAPTCHA가 제대로 초기화되지 않았습니다. 새로고침 후 다시 시도해주세요.");
      }
      
      console.log("📤 인증 요청 준비됨", {
        authReady: !!auth,
        verifierReady: !!recaptchaVerifierRef.current,
        appCheckStatus: process.env.REACT_APP_DISABLE_APPCHECK === 'true' ? '비활성화됨' : '활성화됨',
        phoneNumber,
      });
      
      try {
        // Firebase 전화번호 인증 요청
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          recaptchaVerifierRef.current
        );
        
        console.log("✅ Firebase 인증 응답 성공", confirmationResult);
        
        if (confirmationResult) {
          setConfirmation(confirmationResult);
          alert("✅ 인증번호가 전송되었습니다.");
        } else {
          throw new Error("인증 요청 실패: 응답이 없습니다.");
        }
      } catch (phoneError) {
        console.error("❌ 전화번호 인증 오류:", phoneError);
        
        // 전화번호 형식 문제
        if (phoneError.code === 'auth/invalid-phone-number') {
          throw new Error("유효하지 않은 전화번호 형식입니다. 국가 코드를 포함한 전체 번호를 확인해주세요.");
        }
        
        // 기타 인증 오류
        throw new Error(`전화번호 인증 실패: ${phoneError.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("❌ 인증번호 전송 실패:", error);
      
      // Firebase 오류 코드에 따른 구체적인 메시지
      if (error.code === 'auth/too-many-requests') {
        setErrorMessage("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else if (error.code === 'auth/quota-exceeded') {
        setErrorMessage("인증 서비스 할당량이 초과되었습니다. 나중에 다시 시도해주세요.");
      } else if (error.code === 'auth/captcha-check-failed') {
        setErrorMessage("보안 인증에 실패했습니다. 페이지를 새로고침 해주세요.");
      } else if (error.code === 'auth/app-check-token-error' || error.code === 'auth/app-check-error') {
        setErrorMessage("앱 보안 인증에 문제가 발생했습니다. 관리자에게 문의하세요.");
      } else {
        setErrorMessage(`인증 실패: ${error?.message || "알 수 없는 오류"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmation) {
      setErrorMessage("인증번호를 먼저 전송해주세요.");
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage("인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await confirmation.confirm(verificationCode);
      if (result?.user) {
        setFirebaseUser(result.user);
        setVerifySuccess(true);
        setErrorMessage("");
        alert("✅ 휴대폰 인증 성공");
      } else {
        throw new Error("인증에 실패했습니다. 사용자 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("❌ 인증 실패:", error);
      
      // 인증 코드 오류 처리
      if (error.code === 'auth/invalid-verification-code') {
        setErrorMessage("인증번호가 올바르지 않습니다. 다시 확인해주세요.");
      } else if (error.code === 'auth/code-expired') {
        setErrorMessage("인증번호가 만료되었습니다. 다시 전송해주세요.");
        setConfirmation(null);
      } else {
        setErrorMessage(`인증 실패: ${error?.message || "알 수 없는 오류"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    if (!verifySuccess || !firebaseUser) {
      setErrorMessage("휴대폰 인증을 먼저 완료해주세요.");
      return;
    }

    const fullPhone = `${formData.phone1}-${formData.phone2}-${formData.phone3}`;
    setIsLoading(true);
    setErrorMessage("");

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
        setErrorMessage(`회원가입 실패: ${res.data?.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("❌ 회원가입 오류:", error);
      
      if (error.response?.data?.message) {
        setErrorMessage(`서버 오류: ${error.response.data.message}`);
      } else {
        setErrorMessage(`서버 오류: ${error.message || "알 수 없는 오류"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* reCAPTCHA container - 항상 존재해야 함 */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
    </div>
  );
};

export default Membership;