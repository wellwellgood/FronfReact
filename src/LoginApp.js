import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./App.module.css";
import api from "./utill/api";

function LoginPage() {
  const navigate = useNavigate();
  const [ID, setId] = useState("");
  const [PW, setPw] = useState("");
  const [PWvalid, setPWvalid] = useState(false);
  const [notAllow, setNotAllow] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userNaame, setUserName] = useState("");
  const [saveID, setSaveID] = useState(false);

  const goToid = () => navigate("/id");
  const goToPassword = () => navigate("/password");
  const goToMembership = () => navigate("/membership");

  useEffect(() => {
    const saved = localStorage.getItem("saveID");
    if (saved) {
      setId(saved);
      setSaveID(true);
    }

    const handleBeforeUnload = () => {
      sessionStorage.clear();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const HandleID = (e) => {
    const value = e.target.value;
    setId(value);
    const regex = /^[A-Za-z0-9]+$/;
    setNotAllow(!regex.test(value));
  };

  const HandlePW = (e) => {
    const value = e.target.value;
    setPw(value);
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,20}$/;
    setPWvalid(regex.test(value));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") loginButton();
  };

  const loginButton = async () => {
    try {
      // 로그인 요청
      const response = await api.post("/api/auth/login", {
        username: ID,
        password: PW
      }, {
        withCredentials: true
      });
  
      const { token: accessToken } = response.data;
      sessionStorage.setItem("userToken", accessToken);
      sessionStorage.setItem("userId", ID);
  
      // ✅ 유저 정보 요청 (토큰으로)
      const userRes = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        withCredentials: true
      });
  
      const { username, name, profile_image } = userRes.data.user;
  
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("name", name);
      sessionStorage.setItem("profileImage", profile_image);
  
      // ✅ 아이디 저장 여부
      if (saveID) {
        localStorage.setItem("saveID", ID);
      } else {
        localStorage.removeItem("saveID");
      }
  
      // ✅ 로그인 완료 후 메인 페이지 이동
      navigate("/main");
  
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("아이디 및 비밀번호를 재확인 바랍니다.\n비밀번호는 대소문자를 포함한 8자리 이상입니다.");
      }
    }
  };
  
  return (
    <div className={styles.App}>
      <header className={styles["App-header"]}>
        <div className={styles.login}>
          <div className={styles.loginform}>
            <div className={styles.logo}></div>
            <h1 className={styles.text}>LOGIN</h1>
            <div className={styles.loginbox}>
              <input
                className={styles.id}
                type="text"
                placeholder="ID"
                value={ID}
                onChange={HandleID}
              />
              <input
                className={styles.pw}
                type="password"
                placeholder="Password"
                value={PW}
                onChange={HandlePW}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* ✅ 아이디 저장 체크박스 */}
            <div className={styles.saveID}>
              <label className={styles.saveIDlabel}>
                <input
                  type="checkbox"
                  checked={saveID}
                  onChange={(e) => setSaveID(e.target.checked)}
                />
                <span className={styles.saveIDtext}> 아이디 저장하기</span>
              </label>
            </div>

            {errorMessage && (
              <p className={styles["error-message"]}>{errorMessage}</p>
            )}

            <button
              className={styles.linkpage}
              onClick={loginButton}
              // disabled={!PWvalid || notAllow}
            >
              <h2>Login</h2>
            </button>

            <div className={styles.findbox}>
              <button className={styles.findbtn} onClick={goToid}>아이디 찾기</button>
              <button className={styles.findbtn} onClick={goToPassword}>비밀번호 찾기</button>
              <button className={styles.findbtn} onClick={goToMembership}>회원가입</button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default LoginPage;
