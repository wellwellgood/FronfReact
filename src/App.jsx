import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './main';
import Search from './search';
import Section2 from './components/Chat/section2';
import File from './components/File/section3';
import Section4SendEmail from './components/email/section4';
import CustomCalendar from './calender/calender';
import LinkPage from './membership';
import Id from './ID';
import Password from './password';
import LoginPage from './LoginApp';
import AccountSetting from './AccountSetting';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [theme, setTheme] = useState(() => sessionStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    sessionStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div>
        <Search
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          searchText={searchText}
          setSearchText={setSearchText}
          showResults={showResults}
          setShowResults={setShowResults}
        />

        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/main" element={<Main setTheme={setTheme} />} />
          <Route path="/ChatApp" element={<Section2 />} />
          <Route path="/file" element={<File />} />
          <Route path="/sendEmail" element={<Section4SendEmail />} />
          <Route path="/customCalendar" element={<CustomCalendar />} />
          <Route path="/membership" element={<LinkPage />} />
          <Route path="/Id" element={<Id />} />
          <Route path="/password" element={<Password />} />
        </Routes>

        {showSettings && (
          <AccountSetting onClose={() => setShowSettings(false)} />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
