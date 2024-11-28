import LiveblockProvider from "@/components/provider/live-block-provider";

export default function WorkspaceLayout({ children }) {
  return <LiveblockProvider>{children}</LiveblockProvider>;
}
