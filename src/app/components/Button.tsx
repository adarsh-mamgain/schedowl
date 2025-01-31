import { LoaderCircle } from "lucide-react";
import Image from "next/image";
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
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  children: ReactNode;
  icon?: string;
  className?: string;
  loading?: boolean;
}

const Button: FC<ButtonProps> = ({
  type = "button",
  variant = "primary",
  size = "medium",
  onClick,
  children,
  icon,
  className = "",
  loading = false,
  ...props
}) => {
  const baseStyles =
    "font-semibold border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] flex items-center justify-center gap-3 transition-all duration-200";
  const variants = {
    primary: `bg-[#1570EF] text-white ${
      loading ? "opacity-90" : "hover:bg-[#1256c4] active:bg-[#0e3e9a]"
    }`,
    secondary: `bg-white text-[#344054] ${
      loading ? "opacity-90" : "hover:bg-[#f0f0f0] active:bg-[#e0e0e0]"
    }`,
    outline: `bg-transparent text-[#344054] border-[#344054] ${
      loading ? "opacity-90" : "hover:bg-[#f0f0f0] active:bg-[#e0e0e0]"
    }`,
  };
  const sizes = {
    small: "text-sm py-2 px-3",
    medium: "text-base py-2.5 px-3",
    large: "text-base py-3 px-4",
  };
  const styles = {
    primary: {
      border: "2px solid",
      borderImageSource:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
    },
    secondary: {
      border: "2px solid",
      borderImageSource:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
    },
    outline: {},
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.medium;
  const style = styles[variant] || styles.primary;

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
      style={{ ...style, width: loading ? buttonWidth : undefined }}
      disabled={loading}
      {...props}
    >
      <div style={{ visibility: loading ? "hidden" : "visible" }}>
        {icon && <Image src={icon} alt="icon" width={20} height={20} />}
        {children}
      </div>
      {loading && (
        <LoaderCircle
          size={20}
          className="absolute cursor-wait animate-spin"
          color={variant === "primary" ? "#fff" : "#344054"}
        />
      )}
    </button>
  );
};

export default Button;
