!macro customInstall
  WriteRegStr HKCU "Software\Classes\qimai-kanshan-v48" "" "URL:Kanshan Desktop Companion"
  WriteRegStr HKCU "Software\Classes\qimai-kanshan-v48" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\qimai-kanshan-v48\DefaultIcon" "" '"$INSTDIR\Kanshan.exe",0'
  WriteRegStr HKCU "Software\Classes\qimai-kanshan-v48\shell\open\command" "" '"$INSTDIR\Kanshan.exe" -- "%1"'
!macroend

!macro customUnInstall
  ReadRegStr $0 HKCU "Software\Classes\qimai-kanshan-v48\shell\open\command" ""
  ${If} $0 == '"$INSTDIR\Kanshan.exe" -- "%1"'
    DeleteRegKey HKCU "Software\Classes\qimai-kanshan-v48"
  ${EndIf}
!macroend
