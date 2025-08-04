/** License information */

// I am top level comment in this file.
import z from 'z';
import threeLevelRelativePath from '../../../threeLevelRelativePath';
import sameLevelRelativePath from './sameLevelRelativePath';
import thirdParty from 'third-party';
import oneLevelRelativePath from '../oneLevelRelativePath';

const what = <template>Used as an expression</template>;

/* Comment associated with an import line */
import otherthing from '@core/otherthing';
import abc from '@core/abc';
import twoLevelRelativePath from '../../twoLevelRelativePath';
import component from '@ui/hello';
import fourLevelRelativePath from '../../../../fourLevelRelativePath';
import something from '@server/something';
import xyz from '@ui/xyz';
import Component from '@glimmer/component';
import { action } from '@ember/object';


export const who = <template>Used as an expression</template>;

export default class Foo extends Component {
  @action
  myCoolFunction(){}

  <template>
    Top-level class template
  </template>
}
