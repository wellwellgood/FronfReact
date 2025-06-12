import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
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
  handleLogout
}) => {
  const navigate = useNavigate();

  // 입력창 변화 처리
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setShowResults(true);
  };

  // 검색 실행 함수
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim() === '') return;
    fetchSearchData(searchText);
  };

  // 검색 결과 클릭 시 페이지 이동
  const handleResultClick = (path) => {
    navigate(path);
    setShowResults(false);
    setSearchText('');
  };

  // 외부 클릭 시 검색 결과 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.search}`)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.topbar}>
      <div className={styles.search}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchText}
            className={styles.searchbox}
            onChange={handleSearchChange}
            placeholder="  Search..."
          />
          <button type="submit" className={styles.searchButton}>
            <FaSearch />
          </button>
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

      <div className={styles.user}>
        <div className={styles.userbox}>
          <button className={styles.logout} onClick={handleLogout}>로그아웃</button>
        </div>
      </div>
    </div>
  );
};

export default Search;
