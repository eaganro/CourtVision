import ReactDOM from 'react-dom/client';
import App from './components/App/App';

function RootComponent() {
  return <App></App>
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<RootComponent />);