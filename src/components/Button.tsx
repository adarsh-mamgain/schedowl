import { LoaderCircle } from "lucide-react";
import {
  FC,
  ReactNode,
  ButtonHTMLAttributes,
  useRef,
  useEffect,
  useState,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

const Button: FC<ButtonProps> = ({
  type = "button",
  variant = "primary",
  size = "medium",
  onClick,
  children,
  className = "",
  loading = false,
  ...props
}) => {
  //   box-shadow: 0px 0px 0px 2px #98A2B324;

  // box-shadow: 0px 1px 1px 0px #1018280D;

  const baseStyles =
    "font-semibold border-2 rounded-lg focus:shadow-[0px_0px_0px_2px_#98A2B324,0px_1px_1px_0px_#1018280D] flex items-center justify-center transition-all duration-200";
  const variants = {
    primary: `bg-[#444CE7] text-white border-[#444CE7] ${
      loading
        ? "opacity-90"
        : "hover:bg-[#3538CD] active:bg-[#3538CD] border-[#3538CD]"
    }`,
    secondary: `bg-white text-[#61646C] border-[##ECECED] ${
      loading ? "opacity-90" : "hover:bg-[#F5F5F6] active:bg-[#F5F5F6]"
    }`,
    // outline: `bg-transparent text-[#344054] border-[#344054] ${
    //   loading ? "opacity-90" : "hover:bg-[#f0f0f0] active:bg-[#e0e0e0]"
    // }`,
    danger: `bg-[#D92D20] text-white border-[#D92D20] ${
      loading ? "opacity-90" : "hover:bg-[#B42318] active:bg-[#B42318]"
    }`,
  };
  const sizes = {
    small: "text-sm py-2 px-3",
    medium: "text-base py-2.5 px-3",
    large: "text-base py-3 px-4",
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.medium;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [loading]);

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`${variantStyle} ${sizeStyle} ${baseStyles} ${className}`}
      onClick={onClick}
      style={{ width: loading ? buttonWidth : undefined }}
      disabled={loading}
      aria-busy={loading ? "true" : "false"}
      aria-disabled={props.disabled ? true : false}
      {...props}
    >
      <div
        className="flex items-center justify-center gap-1"
        style={{ visibility: loading ? "hidden" : "visible" }}
      >
        {children}
      </div>
      {loading && (
        <LoaderCircle
          size={20}
          className="absolute cursor-wait animate-spin"
          color={variant === "primary" ? "#fff" : "#344054"}
          aria-live="polite"
        />
      )}
    </button>
  );
};

export default Button;
