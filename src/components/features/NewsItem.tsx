import s from "@/src/app/landing.module.css";

interface NewsItemProps {
  date: string;
  text: string;
}

export function NewsItem({ date, text }: NewsItemProps) {
  return (
    <div className={s.newsItem}>
      <span className={s.newsDate}>{date}</span>
      <p className={s.newsText}>{text}</p>
    </div>
  );
}