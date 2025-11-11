// Type declarations for CSS imports
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "react-grid-layout/css/styles.css";
declare module "react-resizable/css/styles.css";
