import { State, createEmptyCard, fsrs, generatorParameters, type Grade } from "ts-fsrs";
import { Card, type IFsrsCalculator } from "./IFsrsCalculator";

export class TsFsrsCalculator implements IFsrsCalculator {
    readonly w: number[];
    readonly desiredR: number;
    readonly decay: number;
    readonly factor: number;

    public constructor(w: number[], m: number[]) {
        this.w = w;
        this.desiredR = m[0];
        this.decay = -0.5;
        this.factor = 19.0 / 81.0;
    }

    calcInterval(r: number, s: number): number {
        return (s / this.factor) * (Math.pow(r, 1.0 / this.decay) - 1.0);
    }

    calcDisplayDifficulty(d: number) {
        return (d - 1.0) / 9.0 * 100.0;
    }

    public steps(reviews: number[]): Card[] {
        const start_date = new Date();
        let fsrs_card = createEmptyCard(start_date);

        let card = new Card(true, 0.0, 0.0, 0.0, 0.0, 0.0, 0);
        const list = [];

        const f = fsrs(generatorParameters({ w: this.w }));

        for (const review of reviews) {
            const date = fsrs_card.due;
            const scheduling_cards = f.repeat(fsrs_card, date);
            fsrs_card = scheduling_cards[<Grade>review].card;

            const displayDifficulty = this.calcDisplayDifficulty(fsrs_card.difficulty);
            const interval = this.calcInterval(this.desiredR, fsrs_card.stability);
            const cumulativeInterval = card.cumulativeInterval + interval;

            if (fsrs_card.state != State.Review) {
                fsrs_card.state = State.Review;
                const days = Math.max(1, Math.round(interval));
                fsrs_card.due = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
            }

            card = new Card(false, fsrs_card.difficulty, displayDifficulty, fsrs_card.stability, interval, cumulativeInterval, review);
            list.push(card);
        }

        return list;
    }
}
