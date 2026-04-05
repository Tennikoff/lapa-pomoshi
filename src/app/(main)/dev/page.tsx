import { Button, Input, Card } from "@/src/components/ui";
import { Navbar } from "@/src/components/ui/Navbar";

export default function DevPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "24px" }}>
          UI-компоненты
        </h1>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>Кнопки</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>Поля ввода</h2>
          <div style={{ maxWidth: "400px" }}>
            <Input label="Email" placeholder="Введите email" />
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>Карточки</h2>
          <Card>
            <h3>Карточка задачи</h3>
            <p>Это пример переиспользуемой карточки.</p>
          </Card>
        </section>
      </main>
    </>
  );
}