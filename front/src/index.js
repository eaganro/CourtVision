import ReactDOM from 'react-dom/client';
import App from './components/App/App';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function RootComponent() {
  return <App></App>
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<RootComponent />);