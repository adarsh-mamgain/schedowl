import { Bounce, ToastContainer } from "react-toastify";

export default function Toaster() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={5000}
      limit={3}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      transition={Bounce}
    />
  );
}
