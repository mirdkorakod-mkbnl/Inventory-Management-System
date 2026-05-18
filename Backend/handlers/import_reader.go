package handlers

import (
	"encoding/csv"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

// readImportFile รองรับ CSV / XLSX / XLS
func readImportFile(c *fiber.Ctx) ([][]string, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, fiber.NewError(400, "file is required")
	}

	f, err := file.Open()
	if err != nil {
		return nil, fiber.NewError(400, "cannot open file")
	}
	defer f.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))

	// ✅ CSV
	if ext == ".csv" {
		reader := csv.NewReader(f)
		return reader.ReadAll()
	}

	// ✅ Excel (.xlsx / .xls)
	if ext == ".xlsx" || ext == ".xls" {
		excel, err := excelize.OpenReader(f)
		if err != nil {
			return nil, fiber.NewError(400, "invalid excel file")
		}

		sheets := excel.GetSheetList()
		if len(sheets) == 0 {
			return nil, fiber.NewError(400, "no sheet found")
		}

		rows, err := excel.GetRows(sheets[0])
		if err != nil {
			return nil, fiber.NewError(400, "cannot read excel rows")
		}

		return rows, nil
	}

	return nil, fiber.NewError(400, "unsupported file type (csv, xlsx, xls only)")
}

