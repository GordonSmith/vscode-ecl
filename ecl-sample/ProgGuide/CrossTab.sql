SELECT *
FROM hpcc_scan('progguide::exampledata::peopleaccts');

WITH people AS (
	SELECT *
	FROM hpcc_scan('progguide::exampledata::peopleaccts')
)
SELECT
	State,
	SUM(COALESCE(ARRAY_LENGTH(Accounts), 0)) AS A1,
	COUNT(*) AS GroupCount
FROM people
GROUP BY State;

WITH people AS (
	SELECT
		*,
		COALESCE(ARRAY_LENGTH(Accounts), 0) AS AccountCount
	FROM hpcc_scan('progguide::exampledata::peopleaccts')
)
SELECT
	State,
	AccountCount AS A1,
	COUNT(*) AS GroupCount,
	SUM(CASE WHEN Gender = 'M' THEN 1 ELSE 0 END) AS MaleCount,
	SUM(CASE WHEN Gender = 'F' THEN 1 ELSE 0 END) AS FemaleCount,
	SUM(CASE WHEN Gender NOT IN ('M', 'F') OR Gender IS NULL THEN 1 ELSE 0 END) AS OtherCount
FROM people
GROUP BY State, AccountCount;

WITH people AS (
	SELECT *
	FROM hpcc_scan('progguide::exampledata::peopleaccts')
),
person_account_metrics AS (
	SELECT
		person.State,
		person.Gender,
		(
			SELECT AVG(account.Balance)
			FROM UNNEST(person.Accounts) AS accounts(account)
			WHERE account.IndustryCode IN ('BB', 'ON', 'FS', 'FC')
			  AND (
					account.AcctType = 'R'
					OR (
						(account.AcctType NOT IN ('O', 'R', 'I') OR account.AcctType IS NULL)
						AND SUBSTRING(account.Account, 1, 1) IN ('4', '5', '6')
					)
			  )
		) AS AverageBal,
		(
			SELECT SUM(account.Balance)
			FROM UNNEST(person.Accounts) AS accounts(account)
			WHERE account.IndustryCode IN ('BB', 'ON', 'FS', 'FC')
			  AND (
					account.AcctType = 'R'
					OR (
						(account.AcctType NOT IN ('O', 'R', 'I') OR account.AcctType IS NULL)
						AND SUBSTRING(account.Account, 1, 1) IN ('4', '5', '6')
					)
			  )
		) AS TotalBal,
		(
			SELECT AVG(account.HighCredit)
			FROM UNNEST(person.Accounts) AS accounts(account)
			WHERE account.IndustryCode IN ('BB', 'ON', 'FS', 'FC')
			  AND (
					account.AcctType = 'R'
					OR (
						(account.AcctType NOT IN ('O', 'R', 'I') OR account.AcctType IS NULL)
						AND SUBSTRING(account.Account, 1, 1) IN ('4', '5', '6')
					)
			  )
		) AS AverageHC
	FROM people AS person
)
SELECT
	State,
	Gender,
	COUNT(*) AS Number,
	AVG(AverageBal) AS AverageBal,
	AVG(TotalBal) AS AverageTotalBal,
	AVG(AverageHC) AS AverageHC
FROM person_account_metrics
GROUP BY State, Gender;

WITH dataset_points AS (
	SELECT 'ds1' AS dataset, x, y
	FROM (VALUES
		(1.0, 1.0), (2.0, 2.0), (3.0, 3.0),
		(4.0, 4.0), (5.0, 5.0), (6.0, 6.0)
	) AS ds1(x, y)
	UNION ALL
	SELECT 'ds2' AS dataset, x, y
	FROM (VALUES
		(1.93896e+009, 2.04482e+009),
		(1.77971e+009, 8.54858e+008),
		(2.96181e+009, 1.24848e+009),
		(2.7744e+009, 1.26357e+009),
		(1.14416e+009, 4.3429e+008),
		(3.38728e+009, 1.30238e+009),
		(3.19538e+009, 1.71177e+009)
	) AS ds2(x, y)
	UNION ALL
	SELECT 'ds3' AS dataset, x, y
	FROM (VALUES
		(1.0, 1.00039), (2.0, 2.07702), (3.0, 2.86158),
		(4.0, 3.87114), (5.0, 5.12417), (6.0, 6.20283)
	) AS ds3(x, y)
),
stats AS (
	SELECT
		dataset,
		COUNT(*) AS c,
		SUM(x) AS sx,
		SUM(y) AS sy,
		SUM(x * x) AS sxx,
		SUM(x * y) AS sxy,
		SUM(y * y) AS syy,
		VAR_POP(x) AS varx,
		VAR_POP(y) AS vary,
		COVAR_POP(x, y) AS varxy,
		CORR(x, y) AS rc
	FROM dataset_points
	GROUP BY dataset
)
SELECT
	dataset,
	c,
	sx,
	sy,
	sxx,
	sxy,
	syy,
	varx,
	vary,
	varxy,
	rc,
	varx - (sxx - sx * sx / c) / c AS variance_check_x,
	vary - (syy - sy * sy / c) / c AS variance_check_y,
	varxy - (sxy - sx * sy / c) / c AS covariance_check,
	rc - (varxy / SQRT(varx * vary)) AS correlation_check,
	'bestFit: y=' || CAST((sy - sx * varxy / varx) / c AS VARCHAR)
		|| ' + ' || CAST(varxy / varx AS VARCHAR) || 'x' AS best_fit
FROM stats
ORDER BY dataset;
SELECT
	CASE
		WHEN Gender = 'M' THEN 'Male'
		WHEN Gender = 'F' THEN 'Female'
		ELSE 'Other'
	END AS GenderCategory,
	COUNT(*) AS PersonCount
FROM hpcc_scan('progguide::exampledata::peopleaccts')
GROUP BY
	CASE
		WHEN Gender = 'M' THEN 'Male'
		WHEN Gender = 'F' THEN 'Female'
		ELSE 'Other'
	END;