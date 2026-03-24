import { createContext, useContext, useRef, useState } from "react";
import { FaInfo, FaCheck, FaExclamationTriangle, FaTimes} from "react-icons/fa"

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismissToast = (id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((toast) => toast.id !== id));
  };

  const addToast = (message, type = "info", duration = 3000) => {
    const id =  crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismissToast(id), duration);
    return id;
  }

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(({ id, message, type }) => (
          <div key={id} className={`toast toast--${type}`}>
            <span className={`toast-icon`}>
              {type === "info" && <FaInfo />}
              {type === "success" && <FaCheck />}
              {type === "warning" && <FaExclamationTriangle />}
              {type === "error" && <FaTimes />}
            </span>
            <span className="toast-message">{message}</span>
            <button className="toast-dismiss" onClick={() => dismissToast(id)}>x</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );


}

export default ToastProvider;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
