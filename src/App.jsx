import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import LoginPage from './LoginApp.js';
import Main from './main';
// import Example from './components/section1/section1';
import Section2 from './components/Chat/section2.js';
import File from './components/File/section3';
import Section4SendEmail from './components/email/section4.js';
import CustomCalendar from './calender/calender';

import Id from './ID.js';
import Password from './password.js';
import LinkPage from './membership.js';

window.addEventListener("unhandledrejection", (event) => {
  console.error("🔥 전역 promise 에러 발생:", event.reason);
});

function App() {

  const[theme , setTheme] = useState(() => 
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme" , theme);
    localStorage.setItem("theme" , theme);
  },[theme]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<Main setTheme={setTheme} />} />
        {/* <Route path="/example" element={<Example />} /> */}
        <Route path="/ChatApp" element={<Section2 />} />
        <Route path="/file" element={<File />} />
        <Route path="/sendEmail" element={<Section4SendEmail />} />
        <Route path="/customCalendar" element={<CustomCalendar />} />
        <Route path="/membership" element={<LinkPage />} />
        <Route path="/Id" element={<Id />} />
        <Route path="/password" element={<Password />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
