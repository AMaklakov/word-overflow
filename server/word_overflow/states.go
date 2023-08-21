package word_overflow

type status string

const (
	statusIdle     status = "idle"
	statusRunning  status = "running"
	statusFinished status = "finished"
)
