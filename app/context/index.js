// Re-export AppContext and AppProvider with a default export
import { AppContext, AppProvider } from './AppContext';

// Re-export named exports
export { AppContext, AppProvider };

// Export AppProvider as default (what React Navigation expects)
export default AppProvider;
