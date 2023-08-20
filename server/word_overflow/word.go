package word_overflow

type Word struct {
	Text    string `json:"text"`
	Written int    `json:"written"`
	Color   string `json:"color"`
}

func NewWord(text, color string) *Word {
	return &Word{text, 0, color}
}

func (w *Word) IsFinished() bool {
	return w.Written >= len(w.Text)
}

func (w *Word) IsUntouched() bool {
	return w.Color == ""
}

func (w *Word) IsWrittenBy(color string) bool {
	return w.Color == color
}

func (w *Word) IsStartedBy(color string) bool {
	return w.IsWrittenBy(color) && !w.IsFinished()
}

func (w *Word) getNextKey() string {
	if w.IsFinished() {
		return ""
	}
	return string(w.Text[w.Written])
}
