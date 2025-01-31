import Image from "next/image";
import { FC, ReactNode, ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

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
  variant = "primary", // 'primary', 'secondary', 'outline'
  size = "medium", // 'small', 'medium', 'large'
  onClick,
  children,
  icon,
  className = "",
  loading = false,
  ...props
}) => {
  // Define base button styles
  const baseStyles =
    "font-semibold border-2 rounded-lg shadow-[0px_1px_2px_0px_#1018280D,0px_-2px_0px_0px_#1018280D_inset,0px_0px_0px_1px_#1018282E_inset] flex items-center justify-center gap-3 transition-all duration-300 ease-in-out";

  // Variant styles for different types of buttons
  const variants = {
    primary: "bg-[#1570EF] text-white",
    secondary: "bg-white text-[#344054]",
    outline: "bg-transparent text-[#344054] border-[#344054]",
  };

  // Size styles
  const sizes = {
    small: "text-sm py-2 px-3",
    medium: "text-base py-2.5 px-3",
    large: "text-base py-3 px-4",
  };

  // Additional styles (border gradient and others)
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

  // Hover, Active, and Disabled States
  const hoverStyles = {
    primary: "hover:bg-[#0D4DFF] active:bg-[#0A3F99]",
    secondary: "hover:bg-[#F1F5F9] active:bg-[#E2E8F0]",
    outline: "hover:bg-[#F1F5F9] active:bg-[#E2E8F0]",
  };

  // Select styles for each variant, size, and state
  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.medium;
  const style = styles[variant] || styles.primary;
  const hoverStyle = hoverStyles[variant] || hoverStyles.primary;

  return (
    <button
      type={type}
      className={`${variantStyle} ${sizeStyle} ${baseStyles} ${hoverStyle} ${className} ${
        loading ? "cursor-wait opacity-50" : ""
      }`}
      onClick={onClick}
      style={style}
      disabled={loading} // Disable button while loading
      {...props}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" width={20} height={20} />
      ) : (
        <>
          {icon && <Image src={icon} alt="icon" width={20} height={20} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
