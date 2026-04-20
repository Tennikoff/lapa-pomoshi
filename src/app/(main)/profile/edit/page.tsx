"use client";

import s from "./editProfile.module.css";

export default function EditVolunteerProfilePage() {
  // Списки ровно из твоей верстки (ничего лишнего не добавляю)
  const competencies = [
    { id: "comp1", label: "Ремонт" },
    { id: "comp2", label: "Фандрайзинг" },
    { id: "comp3", label: "Транспортировка" },
    { id: "comp4", label: "Ветпомощь" },
    { id: "comp5", label: "Социализация" },
    { id: "comp6", label: "Фото/видео" },
  ];

  const availability = [
    { id: "day1", label: "Пн" },
    { id: "day2", label: "Вт" },
    { id: "day3", label: "Ср" },
    { id: "day4", label: "Чт" },
    { id: "day5", label: "Пт" },
    { id: "day6", label: "Сб" },
    { id: "day7", label: "Вс" },
    { id: "time1", label: "Днём" },
    { id: "time2", label: "Вечером" },
  ];

  const animals = [
    { id: "animal1", label: "Собаки" },
    { id: "animal2", label: "Кошки" },
    { id: "animal3", label: "Рыбы" },
    { id: "animal4", label: "Кролики" },
    { id: "animal5", label: "Птицы" },
    { id: "animal6", label: "Грызуны" },
    { id: "animal7", label: "Хорьки" },
    { id: "animal8", label: "Рептилии" },
  ];

  const interaction = [
    { id: "interact1", label: "Приюты" },
    { id: "interact2", label: "Частные передержки" },
  ];

  const districts = [
    { id: "loc1", label: "Кировский" },
    { id: "loc2", label: "Верх-Исетский" },
    { id: "loc3", label: "Железнодорожный" },
    { id: "loc4", label: "Октябрьский" },
    { id: "loc5", label: "Академический" },
    { id: "loc6", label: "Орджоникидзевский" },
    { id: "loc7", label: "Ленинский" },
    { id: "loc8", label: "Чкаловский" },
  ];

  return (
    <div className={s.page}>
      <div className={s.container}>
        <form className={s.form}>
          <div className={s.profileInfo}>
            <div className={s.avatar} />
            <h1 className={s.name}>Фамилия Имя</h1>
            <p className={s.role}>Волонтёр</p>
          </div>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>О себе</h2>
            <textarea
              className={s.textarea}
              placeholder="Расскажите о себе: опыт, навыки, почему хотите помогать животным..."
            />
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Компетенции</h2>
            <div className={s.tags}>
              {competencies.map((t) => (
                <div key={t.id} className={s.tagItem}>
                  <input id={t.id} type="checkbox" className={s.tagInput} />
                  <label htmlFor={t.id} className={s.tagLabel}>
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Доступность</h2>
            <div className={s.tags}>
              {availability.map((t) => (
                <div key={t.id} className={s.tagItem}>
                  <input id={t.id} type="checkbox" className={s.tagInput} />
                  <label htmlFor={t.id} className={s.tagLabel}>
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Предпочтения (Животные)</h2>
            <div className={s.tags}>
              {animals.map((t) => (
                <div key={t.id} className={s.tagItem}>
                  <input id={t.id} type="checkbox" className={s.tagInput} />
                  <label htmlFor={t.id} className={s.tagLabel}>
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Предпочтения (Взаимодействие)</h2>
            <div className={s.tags}>
              {interaction.map((t) => (
                <div key={t.id} className={s.tagItem}>
                  <input id={t.id} type="checkbox" className={s.tagInput} />
                  <label htmlFor={t.id} className={s.tagLabel}>
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Локация</h2>
            <p className={s.city}>Город: Екатеринбург</p>

            <div className={s.tags}>
              {districts.map((t) => (
                <div key={t.id} className={s.tagItem}>
                  <input id={t.id} type="checkbox" className={s.tagInput} />
                  <label htmlFor={t.id} className={s.tagLabel}>
                    {t.label}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <button type="submit" className={s.saveButton}>
            СОХРАНИТЬ
          </button>
        </form>
      </div>
    </div>
  );
}