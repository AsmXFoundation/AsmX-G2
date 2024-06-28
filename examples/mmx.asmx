
@function main {
    @store $mm0, uint16 [120] ;; $mm0 = [120, 0x00, 0x00, 0x00]  $mmi0 = 0x01
    @store $mm0, uint16 [120] ;; $mm0 = [120, 120, 0x00, 0x00]   $mmi0 = 0x02
    @store $mm0, uint16 [120] ;; $mm0 = [120, 120, 120, 0x00]    $mmi0 = 0x03
    @store $mm0, uint16 [120] ;; $mm0 = [120, 120, 120, 120]     $mmi0 = 0x04

    @push $mm0
    @system 4                 ;; output: $mm0 = [120, 120, 120, 120]

    @push $mmi0
    @system 4                 ;; output: 0x00000004
} 

