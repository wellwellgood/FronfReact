import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./section3.module.css";

// ✅ 환경에 따라 API 주소 자동 선택
const API = process.env.REACT_APP_API || "http://localhost:3001";

export default function FileUploadPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const gotoHome = () => navigate("/main");
  const gotoLink1 = () => navigate("/ChatApp");
  const gotoLink2 = () => navigate("/file");
  const gotoLink3 = () => navigate("/sendEmail");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("파일을 선택하세요.");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        alert("파일 업로드 완료!");
        setFile(null);
        inputRef.current.value = "";
        fetchFiles();
      } else {
        alert("업로드 실패");
      }
    } catch (error) {
      console.error("업로드 실패:", error);
      alert("업로드 중 오류 발생");
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API}/files`);
      if (response.data.success) {
        setUploadedFiles(response.data.files);
      }
    } catch (error) {
      console.error("파일 목록 불러오기 실패:", error);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const response = await axios.get(`${API}/download/${fileName}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("다운로드 실패:", error);
      alert("다운로드 중 오류 발생");
    }
  };

  const handleChange = (e) => setText(e.target.value);

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className={styles.body}>
      <nav>
        <div className={styles.nav}>
          <div className={styles.logo1}>
            <h2>Logo</h2>
              <span></span>
            </div>
          <ul>
            <li><button className={styles.button} onClick={gotoHome}>Home</button></li>
            <li><button className={styles.button} onClick={gotoLink1}>Chat</button></li>
            <li><button className={styles.button} onClick={gotoLink2}>File</button></li>
            <li><button className={styles.button} onClick={gotoLink3}>Email</button></li>
          </ul>
          <div className={styles.setting}><Link to="/">Setting</Link></div>
        </div>
      </nav>
      <div className={styles.topbar}>
        <div className={styles.search}>
          <input 
            type="text"
            value={text}
            className={styles.searchbox}
            onChange={handleChange}
            placeholder="  Search..."
          />
        </div>
        <div className={styles.user}>
          <button className={styles.logout} onClick={handleLogout}>로그아웃</button>
        </div>
      </div>

      <div className={styles.fileUpload}>
        <h2>파일 업로드 및 다운로드</h2>
        <div className={styles.upload}>
          <input type="file" ref={inputRef} onChange={handleFileChange} />
          <button onClick={handleUpload}>업로드</button>
        </div>

        <h3>업로드된 파일 목록</h3>
        <div className={styles.fileList}>
          {uploadedFiles.length === 0 ? (
            <p>업로드된 파일이 없습니다.</p>
          ) : (
            uploadedFiles.map((fileName, index) => (
              <div key={index} className={styles.fileItem}>
                <span>{fileName}</span>
                <button onClick={() => handleDownload(fileName)}>다운로드</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
