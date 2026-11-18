$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$recognizer = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | Where-Object { $_.Culture.TwoLetterISOLanguageName -eq 'en' } | Select-Object -First 1
if (-not $recognizer) { throw 'English recognition unavailable' }
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine($recognizer)
$audio = New-Object System.IO.MemoryStream
try {
 [Console]::OpenStandardInput().CopyTo($audio)
 $audio.Position = 0
 $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
 $engine.SetInputToAudioStream($audio, $format)
 $engine.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
 while ($true) {
   try { $result = $engine.Recognize() }
   catch [System.InvalidOperationException] {
     if ($audio.Position -eq $audio.Length) { break }
     throw
   }
   if (-not $result) { break }
   if ($result.Confidence -ge 0.35) { [Console]::WriteLine($result.Text) }
 }
} finally { $engine.Dispose(); $audio.Dispose() }
