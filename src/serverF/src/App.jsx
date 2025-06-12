import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import LoginPage from './LoginApp.js';
import Main from './main';
// import Example from './components/section1/section1';
import ChatApp from './components/Chat/section2.js';
import File from './components/File/section3';
import SendEmail from './components/email/section4';
import CustomCalendar from './calender/calender';

import Id from './ID.js';
import Password from './password.js';
import LinkPage from './membership.js';

window.addEventListener("unhandledrejection", (event) => {
  console.error("🔥 전역 promise 에러 발생:", event.reason);
});

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<Main />} />
        {/* <Route path="/example" element={<Example />} /> */}
        <Route path="/ChatApp" element={<ChatApp />} />
        <Route path="/file" element={<File />} />
        <Route path="/sendEmail" element={<SendEmail />} />
        <Route path="/customCalendar" element={<CustomCalendar />} />
        <Route path="/membership" element={<LinkPage />} />
        <Route path="/Id" element={<Id />} />
        <Route path="/password" element={<Password />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
