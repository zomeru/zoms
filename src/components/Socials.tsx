import { socials } from "@/constants";

export function Socials() {
  return (
    <div className="flex items-center space-x-3">
      {socials.map(({ url, Icon }) => {
        const label = url.includes("mail") ? "email" : url.replace("/", "");

        return (
          <a href={url} key={url} target="_blank" rel="noopener" aria-label={label}>
            <Icon className="text-3xl text-text-secondary transition-colors duration-300 ease-in-out hover:text-primary" />
          </a>
        );
      })}
    </div>
  );
}
