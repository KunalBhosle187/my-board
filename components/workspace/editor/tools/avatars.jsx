import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Avatars() {
  const users = useOthers();
  const currentUser = useSelf();
  const all = [...users, currentUser];
  return (
    <div className="flex -space-x-5">
      {all.map(({ connectionId, info }, i) => {
        return (
          <Avatar key={i + info.name}>
            <AvatarImage src={info.avatar} />
            <AvatarFallback>{info.name}</AvatarFallback>
          </Avatar>
        );
      })}
    </div>
  );
}

export default Avatars;
