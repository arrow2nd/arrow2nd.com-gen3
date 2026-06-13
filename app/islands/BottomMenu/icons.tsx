// Tabler Icons: https://tabler.io/icons
// honox は island の default export を包むため、ここには default を置かず named export のみとする

type Props = {
  class?: string;
};

// 24x24 viewBox / fill currentColor / aria-hidden を全アイコン共通にするためのラッパー
function Icon({ class: className, children }: Props & { children: unknown }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      class={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// --- ナビゲーション ---

// fish-bone
export function HomeIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16.675 6.44l.118 .005a1 1 0 0 1 .232 .052l.032 .015l.273 .103c1.936 .771 3.69 2.27 5.253 4.476l.245 .355a1 1 0 0 1 0 1.12c-1.702 2.519 -3.636 4.176 -5.792 4.947a1 1 0 0 1 -1.093 -.288a7.97 7.97 0 0 1 -1.883 -4.225h-2.06v3a1 1 0 0 1 -2 0v-3h-2v1a1 1 0 0 1 -2 0v-1h-1.166l-.335 .324a39 39 0 0 0 -1.751 1.846a1 1 0 0 1 -1.496 -1.328q .593 -.667 1.214 -1.308l.522 -.528l-.523 -.529a42 42 0 0 1 -.613 -.648l-.6 -.661a1 1 0 1 1 1.496 -1.328a40 40 0 0 0 2.069 2.161l1.183 -.001v-1a1 1 0 1 1 2 0v1h2v-3a1 1 0 0 1 2 0v3h2.062a7.97 7.97 0 0 1 1.656 -3.953l.196 -.24l.075 -.081l.105 -.088l.068 -.048l.097 -.052l.069 -.03l.138 -.042l.091 -.017q .059 -.007 .118 -.009m1.325 3.56a1 1 0 0 0 -.993 .883l-.007 .127a1 1 0 0 0 1.993 .117l.007 -.127a1 1 0 0 0 -1 -1" />
    </Icon>
  );
}

// user
export function AboutIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
      <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
    </Icon>
  );
}

// briefcase-2
export function WorksIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-9a3 3 0 0 1 3 -3h2v-1a3 3 0 0 1 3 -3zm0 2h-4a1 1 0 0 0 -1 1v1h6v-1a1 1 0 0 0 -1 -1" />
    </Icon>
  );
}

// phone
export function ContactIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M9 3a1 1 0 0 1 .877 .519l.051 .11l2 5a1 1 0 0 1 -.313 1.16l-.1 .068l-1.674 1.004l.063 .103a10 10 0 0 0 3.132 3.132l.102 .062l1.005 -1.672a1 1 0 0 1 1.113 -.453l.115 .039l5 2a1 1 0 0 1 .622 .807l.007 .121v4c0 1.657 -1.343 3 -3.06 2.998c-8.579 -.521 -15.418 -7.36 -15.94 -15.998a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
    </Icon>
  );
}

// --- 作品カテゴリ ---

// imac
export function WebIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 22a1 1 0 0 1 0 -2h.616l.25 -2h-4.866a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-4.867l.25 2h.617a1 1 0 0 1 0 2zm5.116 -4h-2.233l-.25 2h2.733z" />
    </Icon>
  );
}

// icons
export function ToolIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4.25 2.603a4.5 4.5 0 1 1 -2.25 3.897l.006 -.229a4.5 4.5 0 0 1 2.244 -3.668" />
      <path d="M5.632 13.504a1 1 0 0 1 1.736 0l4 7a1 1 0 0 1 -.868 1.496h-8a1 1 0 0 1 -.868 -1.496z" />
      <path d="M13.293 2.293a1 1 0 0 1 1.414 0l7 7a1 1 0 1 1 -1.414 1.414l-7 -7a1 1 0 0 1 0 -1.414" />
      <path d="M20.293 2.293a1 1 0 0 1 1.414 1.414l-7 7a1 1 0 0 1 -1.414 -1.414z" />
      <path d="M21 13a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-7a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1z" />
    </Icon>
  );
}

// device-gamepad-2
export function GameIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M15.5 4a6 6 0 0 1 5.945 5.187l1.532 7.883a3.3 3.3 0 0 1 -5.632 2.903l-3.776 -3.974l-3.14 .001l-3.719 3.916a3.3 3.3 0 0 1 -5.629 -2.92l1.634 -8.173a6 6 0 0 1 5.885 -4.823zm-7.5 3a1 1 0 0 0 -1 1v1h-1a1 1 0 1 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0 -2h-1v-1a1 1 0 0 0 -1 -1m10 2h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0 -2" />
    </Icon>
  );
}

// star
export function StickerIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
    </Icon>
  );
}

// --- 連絡先 ---

// brand-x
export function XIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8.267 3a1 1 0 0 1 .73 .317l.076 .092l4.274 5.828l5.946 -5.944a1 1 0 0 1 1.497 1.32l-.083 .094l-6.163 6.162l6.262 8.54a1 1 0 0 1 -.697 1.585l-.109 .006h-4.267a1 1 0 0 1 -.73 -.317l-.076 -.092l-4.276 -5.829l-5.944 5.945a1 1 0 0 1 -1.497 -1.32l.083 -.094l6.161 -6.163l-6.26 -8.539a1 1 0 0 1 .697 -1.585l.109 -.006h4.267z" />
    </Icon>
  );
}

// brand-github
export function GitHubIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z" />
    </Icon>
  );
}

// mail
export function MailIcon(props: Props) {
  return (
    <Icon {...props}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" />
      <path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
    </Icon>
  );
}
