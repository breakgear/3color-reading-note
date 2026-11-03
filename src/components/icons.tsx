// 線だけのシンプルなアイコン（すべて飾りなので読み上げ対象外）
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

export const IconShelf = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <rect x="4" y="4" width="4" height="16" />
    <rect x="10" y="4" width="4" height="16" />
    <path d="M16 5.2l3.4-.9 3 14.6-3.4.9z" />
  </svg>
);
export const IconInbox = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4v11" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4 15v4h16v-4" />
  </svg>
);
export const IconReview = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4h-4" />
  </svg>
);
export const IconPlus = ({ className = "size-5" }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconBack = ({ className = "size-6" }: P) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconChevron = ({ className = "size-4" }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconCheck = ({ className = "size-4" }: P) => (
  <svg {...base} strokeWidth={2.4} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconQuestion = ({ className = "size-4" }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" />
    <path d="M12 17h.01" />
  </svg>
);
export const IconPencil = ({ className = "size-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M4 20l4-1 11-11-3-3L5 16z" />
    <path d="M14 7l3 3" />
  </svg>
);
export const IconCamera = ({ className = "size-7" }: P) => (
  <svg {...base} className={className}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const IconTask = ({ className = "size-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);
