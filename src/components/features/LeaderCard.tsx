import Image from "next/image";
import s from "@/src/app/landing.module.css";

interface LeaderCardProps {
  image: string;
  name: string;
  tasks: number;
}

export function LeaderCard({ image, name, tasks }: LeaderCardProps) {
  return (
    <div className={s.leaderItem}>
      <div className={s.leaderAvatar}>
        <Image
          src={image}
          alt={name}
          fill
          className={s.leaderAvatarImage}
        />
      </div>
      <div className={s.leaderName}>{name}</div>
      <div className={s.leaderTasks}>{tasks} задач</div>
    </div>
  );
}