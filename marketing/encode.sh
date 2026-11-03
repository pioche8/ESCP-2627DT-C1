#!/bin/bash
# Encode rendered frames (see render-frames.js): the 1920x1080 film (H.264, yuv420p, bt709, faststart) and the
# 1080x1920 reel cut: film scaled to 1080x608 at y=680 over navy, the headline overlay (reel-overlay.png, a transparent
# 1080x1920 PNG built in HTML with the vendored fonts, text inside the Reel safe zone) and a silent AAC track.
#   bash marketing/encode.sh <work-dir>     (work-dir holds frames/%05d.png and reel-overlay.png)
set -e
cd "${1:-.}"
ffmpeg -y -loglevel error -framerate 30 -i frames/%05d.png -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart TenderScout-launch-film-1920x1080.mp4
ffmpeg -y -loglevel error -i TenderScout-launch-film-1920x1080.mp4 -loop 1 -i reel-overlay.png -f lavfi -i anullsrc=r=48000:cl=stereo -filter_complex "color=c=0x0C1633:s=1080x1920:r=30[bg];[0:v]fps=30,scale=1080:-2,setsar=1[v];[bg][v]overlay=0:680:shortest=1[o];[o][1:v]overlay=0:0:shortest=1,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[out]" -map "[out]" -map 2:a -shortest -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 128k -movflags +faststart TenderScout-launch-reel-1080x1920.mp4
ls -la TenderScout-launch-*.mp4
for f in TenderScout-launch-film-1920x1080.mp4 TenderScout-launch-reel-1080x1920.mp4; do echo "== $f"; ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate -show_entries format=duration -of compact "$f"; done
# check frames: first, middle, last of the film; middle of the reel
ffmpeg -y -loglevel error -i TenderScout-launch-film-1920x1080.mp4 -vf "select='eq(n,0)+eq(n,675)+eq(n,1349)'" -vsync 0 check-film-%d.png
ffmpeg -y -loglevel error -ss 22.5 -i TenderScout-launch-reel-1080x1920.mp4 -frames:v 1 check-reel-mid.png
ls check-*.png
