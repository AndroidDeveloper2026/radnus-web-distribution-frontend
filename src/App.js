import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './AppRouter';
import { ToastContainer } from './components/ui/UI';
import './index.css';
import './components/ui/UI.css';
import './components/layout/Layout.css';
import './pages/Auth/Auth.css';
import './pages/Dashboard/Dashboard.css';
import './pages/Products/Products.css';
import './pages/Features/Features.css';
import './pages/Profile/Profile.css';
import './pages/Reports/Reports.css';


const App = () => (
  <Provider store={store}>
    <ThemeProvider>
      <AppRouter />
      <ToastContainer />
    </ThemeProvider>
  </Provider>
);

export default App;
