import { useTranslations } from "next-intl";
import HeroPhoto from "./HeroPhoto";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <HeroPhoto
      kicker={t("kicker")}
      title={t("title")}
      subtitle={t("subtitle")}
      cta={t("cta")}
      ctaHref="/category/compressions"
    />
  );
}
