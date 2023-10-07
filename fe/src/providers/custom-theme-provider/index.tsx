import { ThemeProvider } from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ReactNode } from 'react';

interface CustomThemeProviderProps {
  children: ReactNode;
}

type NextArrowProps = {
  loop: boolean;
  handleNext: () => void;
  activeIndex: number;
  lastIndex: boolean;
};

type PrevArrowProps = {
  loop: boolean;
  handlePrev: () => void;
  activeIndex: number;
  firstIndex: boolean;
};

export default function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  const theme = {
    carousel: {
      defaultProps: {
        prevArrow: ({ loop, handlePrev, firstIndex }: PrevArrowProps) => {
          return (
            <button
              onClick={handlePrev}
              disabled={!loop && firstIndex}
              className="!absolute top-2/4 left-4 -translate-y-2/4 rounded-full select-none transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-12 max-w-[48px] h-12 max-h-[48px] text-white hover:bg-white/10 active:bg-white/30 grid place-items-center"
            >
              <ChevronLeftIcon strokeWidth={3} className="-ml-1 h-7 w-7" />
            </button>
          );
        },
        nextArrow: ({ loop, handleNext, lastIndex }: NextArrowProps) => (
          <button
            onClick={handleNext}
            disabled={!loop && lastIndex}
            className="!absolute top-2/4 right-4 -translate-y-2/4 rounded-full select-none transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none w-12 max-w-[48px] h-12 max-h-[48px] text-white hover:bg-white/10 active:bg-white/30 grid place-items-center"
          >
            <ChevronRightIcon strokeWidth={3} className="ml-1 h-7 w-7" />
          </button>
        ),
        navigation: () => {
          return;
        },
        autoplay: false,
        autoplayDelay: 5000,
        transition: {
          type: "tween",
          duration: 0.5,
        },
        loop: false,
        className: "",
      },
      styles: {
        base: {
          carousel: {
            position: "relative",
            width: "w-full",
            height: "h-full",
            overflowX: "overflow-x-hidden",
            display: "flex",
            gap: "gap-3"
          },

          slide: {
            width: "w-[33%]",
            height: "h-full",
            display: "inline-block",
            flex: "flex-none",
          },
        },
      },
    },
  };

  return (
    <ThemeProvider value={theme}>
      {children}
    </ThemeProvider>
  );
}
