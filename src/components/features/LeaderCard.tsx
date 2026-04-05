import s from "@/src/app/landing.module.css";

interface LeaderCardProps {
  emoji: string;
  name: string;
  tasks: number;
}

export function LeaderCard({ emoji, name, tasks }: LeaderCardProps) {
  return (
    <div className={s.leaderItem}>
      <div className={s.leaderAvatar}>{emoji}</div>
      <div className={s.leaderName}>{name}</div>
      <div className={s.leaderTasks}>{tasks} задач</div>
    </div>
  );
}