import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './search.module.css';

const Search = ({
  fetchSearchData,
  searchResults = [],
  isLoading = false,
  setSearchText,
  searchText,
  showResults,
  setShowResults,
  handleLogout,
  setTheme
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ profile_image: "" });
  const [profileImage, setProfileImage] = useState("");
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const infoRef = useRef();

  useEffect(() => {
    const storedImage = sessionStorage.getItem("profileImage");
    const username = sessionStorage.getItem("username");
    if (!username) return;

    setProfileImage(storedImage);

    axios.get(`/api/users/${username}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("유저 정보 가져오기 실패:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(`.${styles.search}`) &&
        !infoRef.current?.contains(event.target)
      ) {
        setShowResults(false);
        setShowInfoForm(false);
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setShowResults(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim() === '') return;
    fetchSearchData(searchText);
  };

  const handleResultClick = (path) => {
    navigate(path);
    setShowResults(false);
    setSearchText('');
  };

  const toggleTheme = (theme) => {
    setTheme(theme);
    setShowThemeMenu(false); // 선택 후 닫기
  };

  const handleProfileClick = () => {
    setShowInfoForm(prev => !prev);
    setShowThemeMenu(false);
  };

  const toggleThemeMenu = () => {
    setShowThemeMenu(prev => !prev);
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarContainer}>
        <div className={styles.search}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchText}
              className={styles.searchbox}
              onChange={handleSearchChange}
              placeholder="  Search..."
            />
            <button type="submit" className={styles.searchButton}><FaSearch /></button>
          </form>
          {showResults && (
            <div className={styles.searchResults}>
              {isLoading ? (
                <div className={styles.loadingIndicator}>검색 중...</div>
              ) : searchResults.length > 0 ? (
                <ul className={styles.result}>
                  {searchResults.map((item) => (
                    <li key={item.id} onClick={() => handleResultClick(item.path)}>
                      <span className={styles.resultTitle}>{item.title}</span>
                      <span className={styles.resultCategory}>{item.category}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noResults}>검색 결과가 없습니다</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.userInfoBox} ref={infoRef}>
          <img
            className={styles.profileImage}
            src={user.profile_image ? `https://react-server-wmqa.onrender.com${profileImage}` : ""}
            alt="프로필"
            onClick={handleProfileClick}
          />

          {showInfoForm && (
            <div className={styles.infoform}>
              <div className={styles.menuItem}>
                <Link to="/app/settings" className={styles.link}>
                  Account settings
                </Link>
              </div>

              <div className={styles.menuItem}>
                <span onClick={toggleThemeMenu} className={styles.link}>Theme</span>
                {showThemeMenu && (
                  <div className={styles.themeMenu}>
                    <div className={styles.light} onClick={() => toggleTheme("light")}>Light</div>
                    <div className={styles.dark} onClick={() => toggleTheme("dark")}>Dark</div>
                  </div>
                )}
              </div>

              <div className={styles.user}>
                <span className={styles.userbox}>
                  <button className={styles.logout} onClick={handleLogout}>로그아웃</button>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
