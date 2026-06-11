import { jaModel, Parser } from "../../lib/budoux";

type Props = {
  children: string;
};

export default function BudouX({ children }: Props) {
  const parser = new Parser(jaModel);

  const result = parser.parse(children).map((word, i) => (
    <span class="inline-block" key={`${i}-${word}`}>
      {word}
    </span>
  ));

  return <>{result}</>;
}
