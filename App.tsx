
import React, { useState } from 'react';
import { UserRole, Profile } from './types';
import AuthView from './views/AuthView';
import Layout from './components/Layout';
import CoachView from './views/CoachView';
import StudentView from './views/StudentView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('');

  const handleLogin = (profile: Profile) => {
    setUser(profile);
    setIsAuthenticated(true);
    setActiveTab(profile.role === UserRole.COACH ? 'inbox' : 'today');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated || !user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    >
      {user.role === UserRole.COACH ? (
        <CoachView activeTab={activeTab} user={user} />
      ) : (
        /* Added missing user prop to StudentView */
        <StudentView activeTab={activeTab} user={user} />
      )}
    </Layout>
  );
};

export default App;
