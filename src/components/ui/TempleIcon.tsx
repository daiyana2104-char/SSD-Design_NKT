import { type SVGProps } from 'react';

export function Temple(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2 L19 9 H5 Z" />
      <path d="M7 10 H17 V20 H7 Z" />
      <path d="M10 14 H14 V20 H10 Z" />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}
