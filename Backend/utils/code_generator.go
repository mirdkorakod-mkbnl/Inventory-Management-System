package utils

import (
	"fmt"
	"time"
)

// PRD-20260121-123456789
func GenerateProductCode() string {
	return fmt.Sprintf(
		"PRD-%s-%d",
		time.Now().Format("20060102"),
		time.Now().UnixNano()%1e9,
	)
}
