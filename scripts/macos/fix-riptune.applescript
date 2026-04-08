try
	set appPath to "/Applications/RipTune.app"
	
	-- Check if the application exists in the Applications folder
	try
		do shell script "test -d " & quoted form of appPath
	on error
		display dialog "RipTune was not found in your Applications folder.\n\nPlease drag RipTune.app to the Applications folder before running this fix." buttons {"OK"} default button 1 with icon stop with title "Fix RipTune"
		return
	end try
	
	-- Execute xattr -cr to clear quarantine/permissions issues
	-- Request administrator privileges to ensure success even with restricted permissions
	do shell script "xattr -cr " & quoted form of appPath with administrator privileges
	
	display dialog "Success! RipTune has been repaired.\n\nYou can now open the application normally from your Applications folder." buttons {"OK"} default button 1 with icon note with title "Fix RipTune"
	
on error errMsg number errNum
	if errNum is not -128 then -- -128 is the error if the user cancels the password prompt
		display dialog "An error occurred: " & errMsg buttons {"OK"} default button 1 with icon stop with title "Fix RipTune"
	end if
end try
